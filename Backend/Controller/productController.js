import Category from '../Model/category.js';
import SubCategory from '../Model/subCategory.js';
import Product from '../Model/product.js';

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      sub_category_id,
      price,
      images,
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

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const product = await Product.create({
      name,
      category_id,
      sub_category_id,
      price,
      description,
      attributes,
      images: imagePaths,
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

export const fetchProducts = async (req, res) => {
  try {
    const { category_id, sub_category_id, search } = req.query;
    let query = {};

    if (category_id) {
      query.category_id = category_id;
    }

    if (sub_category_id) {
      query.sub_category_id = sub_category_id;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query)
      .populate('category_id')
      .populate('sub_category_id');

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
