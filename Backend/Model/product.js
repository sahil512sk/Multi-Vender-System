import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            default: '',
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

        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        images: {
            type: [String],
            required: true,
            default: [],
        },

        attributes: {
            type: Map,
            of: String,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

productSchema.virtual('discounted_price').get(function () {
    return this.price - (this.price * this.discount) / 100;
});

export default mongoose.model('Product', productSchema);