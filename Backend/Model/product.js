import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },

        sub_category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory',
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        attributes: {
            type: Map,
            of: String,
            default: {},
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Product', productSchema);