import { readFile } from "fs/promises";

const json = await readFile("./image-url-to-key-object.json", "utf8");
const urlsToKeysObject = JSON.parse(json);

const map = new Map();

Object.keys(urlsToKeysObject).forEach((key) => {
  if (map.has(key)) {
    map.set(key, map.get(key) + 1);
  } else {
    map.set(key, 1);
  }
});

const nums = map.keys();
console.log(nums);

let hasMoreThanOne = false;

for (const num in nums) {
  if (num > 1) {
    hasMoreThanOne = true;
  }
}
console.log(hasMoreThanOne);
