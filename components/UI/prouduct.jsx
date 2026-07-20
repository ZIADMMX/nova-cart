import Link from "next/link";
import Image from "next/image";

export default function Product({product}) {
    return(
        <Link href={`/products/${product._id || product.id}`} className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200
             dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg 
             hover:border-indigo-500 dark:hover:border-indigo-500 transition-all 
             duration-300 h-full flex flex-col">
                        <div className="relative w-full aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <Image src={product.imageUrl || "/placeholder.png"} alt={product.title} 
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="w-full h-full object-cover transition-transform duration-500 
                            group-hover:scale-105"
                            />
                            {product.stock < 1 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                    <span className="text-white bg-rose-600 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                        Out of Stock
                                    </span>
                                </div>
                            )}
                         </div>
                         <div className="p-5 flex flex-col flex-1">
                                <div className="mb-3">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-md">
                                        {product.category}
                                    </span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                    {product.title}
                                </h3>
                                <p className="line-clamp-2 text-gray-500 dark:text-gray-400 text-xs mb-4 leading-relaxed">{product.description}</p>
                            
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        product.stock > 0 
                                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" 
                                            : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                                    }`}>
                                        {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                                    </span>
                                </div>
                            </div> 

            </div>
        </Link>
    )
}
