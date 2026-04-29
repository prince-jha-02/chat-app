import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudniary.js";


const generateAccessToken = async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=await user.generateAccessToken()
        

        

        

        return {accessToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while genrating access token")
    }
}

const setonline=async(userId)=>{
    const user = await User.findByIdAndUpdate(
        userId,
        { isOnline: true },   
        { new: true }         
    );

    return user;
}

const getLastSeen = (lastSeen) => {
  const diff = Date.now() - new Date(lastSeen);

  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
};//will use to display last seen to user or say calculate last seen

const registerUser=async(req,res)=>{
    const {userName,email,password}=req.body;

    if ([email,userName,password].some((field)=>field?.trim()==="")
        ) {
            throw new ApiError(400,"all fields are required")        
        }
    const existedUser=await User.findOne({userName})
    if(existedUser){
            throw new ApiError(409,"user with  username already exist")
    }
    const profilePicLocalPath=req.files?.profilePic[0]?.path
    const profilePic=await uploadCloudinary(profilePicLocalPath)

    if(!profilePic){
            throw new ApiError(400,"profile file is required")
        }
    const user =await User.create({
            
            profilePic:profilePic.url,
            email,
            password,
            userName:userName.toLowerCase()
        })
    
        const createdUser=await User.findById(user._id).select(
            "-password "
        )
    
        if(!createdUser){
            throw new ApiError(500, "something went wrong while registering user")
        }
    
        return res.status(201).json(
            new ApiResponse(200,createdUser,"user registerd succesfully")
        )

}

const login=async(req,res)=>{
    const {userName,email,password}=req.body
    if(!userName && !email){
        throw new ApiError(400,"username or password is required")
    }

    const user=await User.findOne({
        $or: [{userName},{email}]
    })

    if (!user) {
        throw new ApiError(404,"user not exist")
    }
    const ispassordValid=await user.isPasswordCorrect(password)
    
    if (!ispassordValid) {
        throw new ApiError(401,"invalid user credentials")
    }
    if (!user) {
        throw new ApiError(404, "User not found while generating token")
    }
    const {accessToken}=await generateAccessToken(user._id)

    await setonline(user._id);

    const loggedUser=await User.findById(user.id).
    select("-password")

    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV === "production"
    }

    return res.status(200).cookie("accessToken",accessToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedUser,accessToken,
                    
                },
                "user logged succesfully"
            )
    )
}

const  getUserProfile=async(req,res)=>{
    const {userId}=req.params

    const user = await User.findById(userId).select("-password");
     if(!user){
                throw new ApiError(401,"invalidaccessToken")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,user,"current user fetched succesfully"))
}

const logout=async(req,res)=>{
    await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    isOnline:false,
                    lastSeen:Date.now()
                }
            },
            {
                returnDocument: 'after'
            }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"));
}

const getFriendsList = async (req, res) => {
    const userId = req.user._id;

    // 🔍 find user and populate friends
    const user = await User.findById(userId)
        .populate("friends", "userName profilePic email");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json({
        success: true,
        friends: user.friends
    });
};

export {registerUser,
    login,
    getUserProfile,
    logout,
    getFriendsList,
}