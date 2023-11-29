import { readFile } from "fs/promises";

const json = await readFile("./posts.json", "utf8");
const { data } = JSON.parse(json);

let imageUrls = [];

for (const post of Object.values(data)) {
  const { list_images } = post;
  if (list_images) {
    imageUrls = imageUrls.concat(list_images);
  }
}

console.log(imageUrls.length);
