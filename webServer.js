const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");

const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");



const app = express();

// Middleware setup
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6");

app.use(express.static(__dirname));
app.use(session({
  secret: "ThisIsTheSecretKeyForDEV",
  resave: false,
  saveUninitialized: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const upload = multer({ storage: multer.memoryStorage() });

// Helper functions
function hasNoUserSession(request, response) {
  if (!request.session.user_id) {
    response.status(401).send("Unauthorized");
    return true;
  }
  return false;
}

function getSessionUserID(request) {
  return request.session.user_id;
}

function processFormBody(request, response, callback) {
  upload.single("uploadedphoto")(request, response, callback);
}

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * POST /admin/login - Login with login_name and password
 */
app.post("/admin/login", async function (request, response) {
  const loginName = request.body.login_name;
  const password = request.body.password;

  if (!loginName || !password) {
    response.status(400).send("Missing login_name or password");
    return;
  }

  try {
    const user = await User.findOne({ login_name: loginName });

    if (!user) {
      response.status(400).send("Invalid login_name");
      return;
    }

    // PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      response.status(400).send("Incorrect password");
      return;
    }

    // STORE USER IN SESSION
    request.session.user_id = user._id;

    response.status(200).json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    });
  } catch (err) {
    console.error("Error in /admin/login", err);
    response.status(500).send(JSON.stringify(err));
  }
});

/**
 * POST /admin/logout - Logout the current user
 */
app.post("/admin/logout", function (request, response) {
  request.session.destroy(function (err) {
    if (err) {
      console.error("Error destroying session:", err);
      response.status(500).send("Error logging out");
      return;
    }
    response.status(200).send("Logged out successfully");
  });
});

/**
 * URL /photos/new - adds a new photo for the current user
 */
app.post("/photos/new", function (request, response) {
  if (hasNoUserSession(request, response)) return;
  const user_id = getSessionUserID(request) || "";
  if (user_id === "") {
    console.error("Error in /photos/new", user_id);
    response.status(400).send("user_id required");
    return;
  }
  processFormBody(request, response, function (err) {
    if (err || !request.file) {
      console.error("Error in /photos/new", err);
      response.status(400).send("photo required");
      return;
    }
    const timestamp = new Date().valueOf();
    const filename = 'U' +  String(timestamp) + request.file.originalname;
    fs.writeFile("./images/" + filename, request.file.buffer, function (err1) {
      if (err1) {
        console.error("Error in /photos/new", err1);
        response.status(400).send("error writing photo");
        return;
      }
      Photo.create(
          {
            _id: new mongoose.Types.ObjectId(),
            file_name: filename,
            date_time: new Date(),
            user_id: new mongoose.Types.ObjectId(user_id),
            comment: []
          })
          .then(() => {
            response.end();
          })
          .catch(err2 => {
            console.error("Error in /photos/new", err2);
            response.status(500).send(JSON.stringify(err2));
          });
    });
  });
});

/**
 * URL /commentsOfPhoto/:photo_id - adds a new comment on photo for the current user
 */
app.post("/commentsOfPhoto/:photo_id", async function (request, response) {
  if (hasNoUserSession(request, response)) return;

  const id = request.params.photo_id || "";
  const user_id = getSessionUserID(request) || "";
  const comment = request.body.comment || "";

  if (id === "") {
    response.status(400).send("id required");
    return;
  }
  if (user_id === "") {
    response.status(400).send("user_id required");
    return;
  }
  if (comment === "") {
    response.status(400).send("comment required");
    return;
  }

  try {
    await Photo.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $push: {
          comments: {
            comment: comment,
            date_time: new Date(),
            user_id: new mongoose.Types.ObjectId(user_id),
            _id: new mongoose.Types.ObjectId()
          }
        }
      }
    );
    response.end();
  } catch (err) {
    console.error("Error in /commentsOfPhoto/:photo_id", err);
    response.status(500).send(JSON.stringify(err));
  }
});

/**
 * URL /favorites/add/:photo_id - adds a photo to the user's favorites
 */
app.post("/favorites/add/:photo_id", async (req, res) => {
  try {
    // Must be logged in
    if (!req.session || !req.session.user_id) {
      return res.status(401).send("Not logged in");
    }

    const userId = req.session.user_id;
    const photoId = req.params.photo_id;

    // Optional: verify the photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(400).send("Photo not found");
    }

    // Add to favorites, prevent duplicates
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: photoId } }, // $addToSet avoids duplicates
      { new: true }
    );

    if (!user) {
      return res.status(400).send("User not found");
    }

    return res.status(200).send(user.favorites);
  } catch (err) {
    console.error("Error adding favorite:", err);
    return res.status(500).send("Server error");
  }
});

/**
 * URL /favorites/remove/:photo_id - removes a photo from the user's favorites
 */
app.post("/favorites/remove/:photo_id", async (req, res) => {
  try {
    // Must be logged in
    if (!req.session || !req.session.user_id) {
      return res.status(401).send("Not logged in");
    }

    const userId = req.session.user_id;
    const photoId = req.params.photo_id;

    // Remove from favorites
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favorites: photoId } },   // $pull removes the ID
      { new: true }
    );

    if (!user) {
      return res.status(400).send("User not found");
    }

    return res.status(200).send(user.favorites);
  } catch (err) {
    console.error("Error removing favorite:", err);
    return res.status(500).send("Server error");
  }
});

/**
 * URL /favorites/:user_id - returns the list of favorited photos
 */
app.get("/favorites/:user_id", async (req, res) => {
  try {
    // Must be logged in
    if (!req.session || !req.session.user_id) {
      return res.status(401).send("Not logged in");
    }

    const userId = req.params.user_id;

    // Get the user and populate the photo objects
    const user = await User.findById(userId).populate("favorites");

    if (!user) {
      return res.status(400).send("User not found");
    }

    // Return the actual photo objects
    return res.status(200).send(user.favorites);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    return res.status(500).send("Server error");
  }
});

/*
 * POST /user - Register a new user
 */
app.post("/user", async function (request, response) {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation
  } = request.body;

  if (!login_name || !password || !first_name || !last_name) {
    response.status(400).send("Missing required fields");
    return;
  }

  try {
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) {
      response.status(400).send("login_name already exists");
      return;
    }

    const newUser = new User({
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation
    });

    await newUser.save();

    response.status(200).send({
      _id: newUser._id,
      login_name: newUser.login_name
    });
  } catch (err) {
    console.error("Error in POST /user:", err);
    response.status(500).send(JSON.stringify(err));
  }
});

/*
 * Reject all other requests if not logged in.
 */
app.use(function (request, response, next) {
  if (
    request.path === "/admin/login" ||
    request.path === "/admin/logout" ||
    request.path === "/user"
  ) {
    next();
    return;
  }

  if (!request.session.user_id) {
    response.status(401).send("Unauthorized");
    return;
  }

  next();
});

// ===========================
// Test Endpoints
// ===========================

/**
 * URL /test/:p1 - Test endpoint to check database info and counts
 */
app.get("/test/:p1", async function (request, response) {
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    try {
      const info = await SchemaInfo.find({});

      if (info.length === 0) {
        response.status(400).send("Missing SchemaInfo");
        return;
      }

      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    } catch (err) {
      console.error("Error in /test/info:", err);
      response.status(500).send(JSON.stringify(err));
    }
  } else if (param === "counts") {
    try {
      const userCount = await User.countDocuments({});
      const photoCount = await Photo.countDocuments({});
      const schemaInfoCount = await SchemaInfo.countDocuments({});

      response.end(JSON.stringify({
        user: userCount,
        photo: photoCount,
        schemaInfo: schemaInfoCount
      }));
    } catch (err) {
      response.status(500).send(JSON.stringify(err));
    }
  } else {
    response.status(400).send("Bad param " + param);
  }
});

// ===========================
// User Endpoints
// ===========================

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", async function (request, response) {
  try {
    const users = await User.find({}, { _id: 1, first_name: 1, last_name: 1 });

    if (users.length === 0) {
      response.status(400).send();
      return;
    }

    response.end(JSON.stringify(users));
  } catch (err) {
    console.error("Error in /user/list", err);
    response.status(500).send(JSON.stringify(err));
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
// app.get("/user/:id", async function (request, response) {
//   const id = request.params.id;

//   try {
//     const user = await User.find({ _id: { $eq: id } }, { __v: 0 });

//     if (user.length === 0) {
//       response.status(400).send();
//       return;
//     }

//     response.end(JSON.stringify(user[0]));
//   } catch (err) {
//     console.error("Error in /user/:id", err);
//     response.status(500).send(JSON.stringify(err));
//   }
// });
  app.get("/user/:id", async function (request, response) {
    const id = request.params.id;

    // Return 400 immediately if it can't be a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      response.status(400).send("Invalid user id");
      return;
    }

    try {
      const user = await User.find(
        { _id: { $eq: id } },
        { __v: 0, password: 0, login_name: 0, favorites: 0 }  // exclude sensitive fields
      );

      if (user.length === 0) {
        response.status(400).send();
        return;
      }

      response.end(JSON.stringify(user[0]));
    } catch (err) {
      console.error("Error in /user/:id", err);
      response.status(500).send(JSON.stringify(err));
    }
  });

// ===========================
// Photo Endpoints
// ===========================

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", async function (request, response) {
  const id = request.params.id;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    response.status(400).send("Invalid user id");
    return;
  }
  
  try {
    const photos = await Photo.aggregate([
      {
        $match: {
          user_id: { $eq: new mongoose.Types.ObjectId(id) }
        }
      },
      {
        $addFields: {
          comments: { $ifNull: ["$comments", []] }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.user_id",
          foreignField: "_id",
          as: "users"
        }
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    user: {
                      $arrayElemAt: [
                        "$users",
                        {
                          $indexOfArray: [
                            "$users._id",
                            "$$this.user_id"
                          ]
                        }
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          users: 0,
          __v: 0,
          "comments.__v": 0,
          "comments.user_id": 0,
          "comments.user.location": 0,
          "comments.user.description": 0,
          "comments.user.occupation": 0,
          "comments.user.login_name": 0,
          "comments.user.__v": 0,
          "comments.user.password": 0,
          "comments.user.favorites": 0
        }
      }
    ]);

    if (photos.length === 0) {
      response.status(400).send();
      return;
    }

    response.end(JSON.stringify(photos));
  } catch (err) {
    console.error("Error in /photosOfUser/:id", err);
    response.status(500).send(JSON.stringify(err));
  }
});

const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
