import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    title : {type : String , required : true },
    description : {type : String , required : true },
    price : {type : Number , required : true , min: 0 },
    currency : {type : String , required : true , default : "USD" },
    category : {type : String , required : true },
    imageUrl : {type : String , required : true },
    stock : {type : Number , required : true , default : 0 , min : 0}, 
    isActive : {type : Boolean , default : true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
} , {timestamps : true});

productSchema.index({title : "text" , description : "text" , category : "text"}); 

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
