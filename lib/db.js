import mongoose from "mongoose";

let cached = global.mongoose;
const MONGO_URI = process.env.MONGODB_URI;

if(!cached){
    cached = global.mongoose = {conn:null , promise : null};
}
 
async function connectToMongo() {
    if(cached.conn) return cached.conn;
    
    if(!cached.promise){
        const opts = {
           bufferCommands: false,
           serverSelectionTimeoutMS: 5000,
        };
        cached.promise = mongoose.connect(MONGO_URI , opts).then((mongoose) => {
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        console.log("error");
        cached.promise = null; 
        throw error;
    }

    return cached.conn;
}



export default connectToMongo;