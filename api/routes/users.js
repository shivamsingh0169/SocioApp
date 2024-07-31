const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt")
router.put("/:id" , async(req , res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        if(req.body.password){
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password , salt);
            }catch(err){
                return res.status(500).json(err);
            }
        }
        try{
            const user = await User.findByIdAndUpdate(req.body.userId , {
                $set : req.body,
            });
            res.status(200).json("Account updated Successfully");
        }catch(err){
            res.status(500).json(err);
        }
    }
    else{
        return res.status(403).json("You can update only your account!")
    }
})
router.delete("/:id" , async(req , res)=>{
    if(req.body.userId === req.params.id || req.body.isAdmin){
        try{
            await User.findByIdAndDelete(req.params.id)
            res.status(200).json("Account deleted Successfully");
        }catch(err){
            return res.status(500).json(err);
        }
    }
    else{
        return res.status(403).json("You can delete only your account!")
    }
})

router.get("/" , async(req , res)=>{
    const userId = req.query.userId;
    const username = req.query.username;
    try{
        const user = userId 
        ? await User.findById(userId)
        : await User.findOne({username : username});
        const {password , updatedAt , ...other} = user._doc;
        res.status(200).json(other);
    }catch(err){
        res.status(500).json(err);
    }
})

router.get("/followings/:userId", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const friends = await Promise.all(
        user.followings.map((friendId) => {
          return User.findById(friendId);
        })
      );
      let friendList = [];
      friends.map((friend) => {
        const { _id, username, profilePicture } = friend;
        friendList.push({ _id, username, profilePicture });
      });
      res.status(200).json(friendList)
    } catch (err) {
      res.status(500).json(err);
    }
  });
router.get("/followers/:userId", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const friends = await Promise.all(
        user.followers.map((friendId) => {
          return User.findById(friendId);
        })
      );
      let friendList = [];
      friends.map((friend) => {
        const { _id, username, profilePicture } = friend;
        friendList.push({ _id, username, profilePicture });
      });
      res.status(200).json(friendList)
    } catch (err) {
      res.status(500).json(err);
    }
  });

router.put("/:id/follow" , async(req , res)=>{
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const curruser = await User.findById(req.body.userId);
            if(!user.followers.includes(req.body.userId)){
                await user.updateOne({$push : {followers : req.body.userId}});
                await curruser.updateOne({$push : {followings : req.params.id}});
                res.status(200).json("User has been followed!");
            }
            else{
                res.status(403).json("You already Follow this user!");
            }
        }catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("You Cannot Follow Yourself!")
    }
})

router.put("/:id/unfollow" , async(req , res)=>{
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const curruser = await User.findById(req.body.userId);
            if(user.followers.includes(req.body.userId)){
                await user.updateOne({$pull : {followers : req.body.userId}});
                await curruser.updateOne({$pull : {followings : req.params.id}});
                res.status(200).json("User has been unfollowed!");
            }
            else{
                res.status(403).json("You have not followed this user!");
            }
        }catch(err){
            res.status(500).json(err);
        }
    }
    else{
        res.status(403).json("You Cannot unFollow Yourself!")
    }
})


router.get("/search", async (req, res) => {
    const query = req.query.query;
    try {
      const users = await User.find({ username: { $regex: query, $options: "i" } });
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json(err);
    }
});

module.exports = router;