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
    productType: { 
        type: String, 
        enum: ['physical', 'digital_file', 'license_key'], 
        default: 'physical' 
    },
    downloadUrl: { type: String, default: "" }, // for digital_file
    licenseKeysPool: [{ type: String }], // for license_key
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
} , {timestamps : true});

productSchema.index({title : "text" , description : "text" , category : "text"}); 

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
