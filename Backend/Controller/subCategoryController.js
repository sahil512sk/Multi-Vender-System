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

export const fetchSubCategories = async (req, res) => {
  try {
    const { category_id } = req.query;
    let query = {};

    if (category_id) {
      query.category_id = category_id;
    }

    const subCategories = await SubCategory.find(query).populate('category_id');
    res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};