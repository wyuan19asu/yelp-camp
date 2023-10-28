const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const Campground = require("./models/campground");
const methodOverride = require("method-override");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Joi = require("joi");
const { campgroundSchema, reviewSchema } = require("./schemas");
const { findById } = require("./models/review");
const Review = require("./models/review");

mongoose
  .connect("mongodb://127.0.0.1:27017/yelp-camp")
  .then(() => {
    console.log("It WORKED connection");
  })
  .catch((error) => handleError(error));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// middleware
const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  console.log(error);

  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    // else, call next or it won't go into actual code inside the fn
    next();
  }
};

// middleware
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  console.log(error);

  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("home");
});

// app.get("/makecampground", async (req, res) => {
//   const camp = new Campground({
//     title: "My Backyard",
//     description: "Cheap camping",
//   });
//   await camp.save();
//   res.send(camp);
// });

app.get(
  "/campgrounds",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

app.get(
  "/campgrounds/new",
  catchAsync((req, res) => {
    res.render("campgrounds/new");
  })
);

app.post(
  "/campgrounds/",
  validateCampground,
  catchAsync(async (req, res, next) => {
    // if (!req.body.campground)
    //   throw new ExpressError("Invalid Campground Data", 400);
    const campground = new Campground(req.body.campground);
    console.log(campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground.id}`);
  })
);

app.get(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate("reviews");
    res.render("campgrounds/show", { campground });
  })
);

app.get(
  "/campgrounds/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    res.render("campgrounds/edit", { campground });
  })
);

app.put(
  "/campgrounds/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(
      id,
      { ...req.body.campground },
      {
        runValidator: true,
        new: true,
      }
    );
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const deleted = await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds/");
  })
);

app.post(
  "/campgrounds/:id/reviews",
  validateReview,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    console.log(campground);

    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.use("*", (req, res, next) => {
  next(new ExpressError("Page not found!", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No!, Something went wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("CONNECTED on port 3000");
});
