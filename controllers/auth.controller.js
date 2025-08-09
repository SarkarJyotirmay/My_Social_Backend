
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../lib/utils/generateToken.js"

// SIGN UP
const signup = async (req, res)=>{
    try {
        const {userName, fullName, email, password} = req.body

        // validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({
                success: false,
                error: "Invalid email format"
            })
        }

        // check existing user
        const existingUser = await User.findOne({userName: userName})
        if(existingUser){
            return res.status(400).json({
                success: false,
                error: "User name already taken.",
                existingUser,
            })
        }

        // check email exists
        const existingEmail = await User.findOne({email: email})
        if(existingEmail){
            return res.status(400).json({
                success: false,
                error: "Email already taken."
            })
        }

        // validate password length
        if(password.length < 4){
            return res.status(400).json({
                success: false,
                error: "Password must be at least 4 characters long."
            })
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // create user
        const user = await User.create({
            userName,
            fullName,
            email,
            password: hashedPassword
        })

        if(!user){
            return res.status(500).json({
                success: false,
                error: "Error in creating user."
            })
        }

        // generate JWT token (optional, not implemented here)
        await generateToken(user._id, res)

        // respond with user data
        const data = {
            _id: user._id,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
            bio: user.bio,
        }
        res.status(201).json({
            success: true,
            data  // exclude password from response  
        })

    } catch (error) {
        console.log(`Error in signup => ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }
}


// LOGIN
const login = async (req, res)=>{
    try {
        const {userName, password} = req.body
        const user = await User.findOne({userName: userName})
        if(!user){
            return res.status(400).json({
                success: false,
                error: "User name  not found."
            })
        }   
        // check password
        const isPasswordValid = await bcrypt.compare(password, user?.password || "")
        if(!isPasswordValid){
            return res.status(400).json({
                success: false,
                error: "Invalid password."
            })
        }
        // generate JWT token
        await generateToken(user._id, res)  
        // respond with user data
        const data = {
            _id: user._id,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            profileImg: user.profileImg,
            coverImg: user.coverImg,
            bio: user.bio,
        }
        res.status(200).json({
            success: true,
            data  // exclude password from response
        })
    } catch (error) {
         console.log(`Error in signup => ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }
}

// LOGOUT
const logout = async (req, res)=>{
    try {
        res.clearCookie("jwt", "",{maxAge: 0})
        res.status(200).json({
            message: "Logged out successfully"
        })
    } catch (error) {
        console.log(`Error in logout => ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }
}

// GET ME
const getMe = async (req, res)=>{
    try {  
        const user = req.user; // user is attached by protectedRoute middleware
        if(!user){
            return res.status(404).json({
                success: false,
                error: "User not found."
            })
        }
        
        const data = await User.findById(user._id.toString())
        .select("-password -__v") // exclude password and version key

        res.status(200).json({
            success: true,
            data  // exclude password from response
        })       
    } catch (error) {
        console.log(`Error in getMe => ${error.message}`);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        })  
    }
}

export {signup, login, logout, getMe}
