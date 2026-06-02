import Category from '../Model/category.js';
import SubCategory from '../Model/subCategory.js';

export const createSubCategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    const existingCategory = await Category.findById(category_id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const subCategory = await SubCategory.create({
      name,
      category_id,
    });

    res.status(201).json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};