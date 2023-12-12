import { readFile } from "fs/promises";

const json = await readFile("./posts.json", "utf8");
const { data } = JSON.parse(json);

let imageUrls = [];
let count = 0;

for (const post of Object.values(data)) {
  const { list_images } = post;
  if (list_images) {
    imageUrls = imageUrls.concat(list_images);
  }

  if (list_images) {
    for (const image of list_images) {
      if (image.includes("https://")) {
        count++;
      }
    }
  }
}

console.log(imageUrls.length);
console.log(count);
