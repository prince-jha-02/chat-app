import { Router } from "express"
import  upload  from "../middleware/multer.middleware.js";
import { getFriendsList, getUserProfile, login, logout, registerUser } from "../controlers/user.controler.js";
import verifyJWT from "../middleware/auth.middleware.js";
const userRouter =Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name:"profilePic",
            maxCount:1
        },
    ]),
    registerUser)

userRouter.route("/login").post(login);

userRouter.get("/profile/:userId", getUserProfile);

userRouter.post("/logout",verifyJWT,logout);

userRouter.post("/getFriends",verifyJWT,getFriendsList);


export default userRouter;