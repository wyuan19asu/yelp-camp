const mongoose = require("mongoose");
const cities = require("./cities");
const Campground = require("../models/campground");
const { places, descriptors } = require("./seedHelpers");

mongoose
  .connect("mongodb://127.0.0.1:27017/yelp-camp")
  .then(() => {
    console.log("It WORKED connection");
  })
  .catch((error) => handleError(error));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];
console.log("sample:", sample);

const seedDB = async () => {
  // deletes everything
  await Campground.deleteMany({});
  // randomly generates 50 campgrounds
  for (let i = 0; i < 50; i++) {
    // 1000 bc there are 1000 cities in the array
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: "https://source.unsplash.com/collection/3846912/",
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Beatae eum ex deserunt quidem ullam cumque vel. A consequatur, illum, voluptatum aliquid excepturi pariatur dolorem nostrum perferendis, ad sed quia culpa.",
      price,
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
