import Category from '../Model/category.js';
import SubCategory from '../Model/subCategory.js';
import Product from '../Model/product.js';

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category_id,
      sub_category_id,
      price,
      attributes,
    } = req.body;

    const existingCategory = await Category.findById(category_id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const existingSubCategory = await SubCategory.findById(
      sub_category_id
    );

    if (!existingSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub Category not found',
      });
    }

    if (
      existingSubCategory.category_id.toString() !==
      category_id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Sub Category does not belong to selected Category',
      });
    }

    const product = await Product.create({
      name,
      category_id,
      sub_category_id,
      price,
      attributes,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};