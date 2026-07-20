import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId : {type : mongoose.Schema.Types.ObjectId, ref : "User", required : true, index : true },
    title : {type : String },
    message : {type : String , required : true }, 
    type : {type : String , required : true ,enum : ["info" , "error" , "success" , "warning", "order", "product", "alert"] , default:"info" },
    isRead : {type : Boolean , default : false },
    
} , {timestamps : true});

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;