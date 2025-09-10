import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";


const profileRoutes = (db) => {
  const router = express.Router();
  //add image 
  router.post("/image", authMiddleware, (req,res)=>{
    const {image} = req.body;
    if(!image){
      res.json({message:"a profile image is required here"})
    }
    try{
      db.prepare(
        "INSERT INTO users (image) VALUES (?)"
      ).run(image);
    }catch(err){
      console.error(err)
      res.status(500).json({message:"something went wrong..."})
    }
  })
  // router.post("/getimage", authMiddleware, (req,res)=>{
  //   const user = db
  //     .prepare("SELECT image FROM users WHERE id = ?")
  //     .get(req.userId);
  // })
  // GET logged-in user's profile
  router.get("/", authMiddleware, (req, res) => {
    const user = db
      .prepare("SELECT id, username, email, image FROM users WHERE id = ?")
      .get(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  });

  // UPDATE logged-in user's profile
router.put("/update", authMiddleware, async (req, res) => {
  const { username, email, password, image } = req.body;

  let updatedFields = [];
  let values = [];

  if (username) {
    updatedFields.push("username = ?");
    values.push(username);
  }

  if (email) {
    updatedFields.push("email = ?");
    values.push(email);
  }

  if (password) {
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);
    updatedFields.push("password = ?");
    values.push(hashedPassword);
  }

  if (image) {
    updatedFields.push("image = ?");
    values.push(image);
  }

  if (updatedFields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(req.userId);

  const stmt = db.prepare(
    `UPDATE users SET ${updatedFields.join(", ")} WHERE id = ?`
  );
  stmt.run(...values);

  const updatedUser = db
    .prepare("SELECT id, username, email, image FROM users WHERE id = ?")
    .get(req.userId);

  res.json({ message: "Profile updated", user: updatedUser });
});


  return router;
};

export default profileRoutes;
