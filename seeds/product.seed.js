import { faker } from "@faker-js/faker";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { v4 as uuid } from "uuid";

export const generateFakeProducts = async (num = 20) => {
  try {
    const categories = await Category.find();

    if (!categories.length) {
      throw new Error(
        "No categories found! Create categories before seeding products."
      );
    }

    const products = [];

    for (let i = 0; i < num; i++) {
      const name = faker.commerce.productName();
      const description = faker.commerce.productDescription();
      const price = parseFloat(faker.commerce.price());
      const brand = faker.company.name();
      const quantity = faker.number.int({ min: 1, max: 100 });
      const stock = faker.number.int({ min: 0, max: quantity });
      const category = faker.helpers.arrayElement(categories)._id;

      const sizes = faker.helpers.arrayElement(["S", "M", "L", "XL", "XXL"]);
      const images = [
        {
          public_id: uuid(),
          url: faker.image.url({
            width: 800,
            height: 800,
            category: "products",
            random: true,
          }),
        },
      ];

      products.push({
        name,
        description,
        price,
        brand,
        quantity,
        stock,
        category,
        images,
        sizes,
        rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        numReviews: faker.number.int({ min: 0, max: 100 }),
      });
    }

    await Product.insertMany(products);
    console.log(`${num} fake products created successfully!`);
  } catch (error) {
    console.error("Error creating fake products:", error);
  }
};
