console.log("\x1b[33m%s\x1b[0m", "STARTING SCRIPT");

import https from "https";
import pkg from "pg";
const { Client } = pkg;
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

console.log("\x1b[33m%s\x1b[0m", `PG_HOST: ${process.env.PG_HOST}`);
const pgClient = new Client({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_DB_USER,
  password: process.env.PG_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});
await pgClient.connect();
console.log("\x1b[33m%s\x1b[0m", `PG_HOST: ${process.env.PG_HOST}`);

await pgClient.query(
  `CREATE TABLE IF NOT EXISTS images_to_process (
    id serial PRIMARY KEY,
    image_url TEXT NOT NULL,
    image_key TEXT NOT NULL
  );`
);

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const json = await readFile("./posts.json", "utf8");
const { data } = JSON.parse(json);

const alreadyProcessed = await readFile("./image-url-to-s3-key-object.json", "utf8");
const alreadyProcessedObject = JSON.parse(alreadyProcessed);

const alreadyProcessedUrls = Object.keys(alreadyProcessedObject);

let imageUrls = [];
for (const post of Object.values(data)) {
  const { list_images } = post;
  if (list_images) {
    for (const imageUrl of list_images) {
      if (alreadyProcessedUrls.includes(imageUrl)) {
        continue;
      }
      imageUrls.push(imageUrl);
    }
  }
}

console.log(imageUrls.length);

let httpsGetPromise = function (src) {
  return new Promise((resolve, reject) => {
    https.get(src, (response) => {
      resolve(response);
    });
  });
};

for (const imageUrl of imageUrls) {
  console.log("start downloading");
  const exitsingRecord = await pgClient.query("SELECT * FROM images_to_process WHERE image_url = $1", [imageUrl]);
  if (exitsingRecord.rows.length) {
    console.log("skipping");
    continue;
  }

  const newImageUuid = uuidv4();
  const response = await httpsGetPromise(imageUrl);

  const uploadInput = new PutObjectCommand({
    ACL: "public-read",
    ContentLength: response.headers["content-length"],
    ContentType: response.headers["content-type"],
    Bucket: process.env.S3_BUCKET,
    Key: `facility/images/${newImageUuid}.${response.headers["content-type"].split("/").pop()}`,
    Body: response,
  });

  await s3.send(uploadInput);

  await pgClient.query("INSERT INTO images_to_process (image_url, image_key) VALUES ($1, $2)", [
    imageUrl,
    `facility/images/${newImageUuid}.${response.headers["content-type"].split("/").pop()}`,
  ]);
  console.log("ended downloading");
}

console.log("\x1b[33m FINISHED \x1b[0m");

await pgClient.end();
