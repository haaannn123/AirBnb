"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    static associate(models) {
      ReviewImage.belongsTo(models.Review, {
        foreignKey: "reviewId",
        hooks: true
       });
    }
  }
  ReviewImage.init(
    {
      reviewId: {
        type: DataTypes.INTEGER,
      },
      url: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "ReviewImage",
    }
  );
  return ReviewImage;
};
