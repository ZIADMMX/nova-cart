import mongoose from "mongoose";


const productSchema = new mongoose.Schema({
    title : {type : String , required : true },
    description : {type : String , required : true },
    price : {type : Number , required : true , min: 0 },
    currency : {type : String , required : true , default : "USD" },
    category : {type : String , required : true },
    imageUrl : {type : String , required : true },
    stock : {type : Number , required : true , default : 0 , min : 0}, 
    isActive : {type : Boolean , default : true },
    
} , {timestamps : true});

productSchema.index({title : "text" , description : "text" , category : "text"}); 

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
