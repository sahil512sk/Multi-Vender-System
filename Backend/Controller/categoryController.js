import Category from '../Model/category.js';

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const category = await Category.create({ name });
        res.status(201).json({
            success: true,
            data: category
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getCategories = async (req, res) => {
    try {
        const categories = await category.find();
        res.status(200).json({
            success: true,
            data: categories
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
export { createCategory, getCategories };