const express = require("express");

const { User, Spot, Review, ReviewImage, SpotImage } = require("../../db/models");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { validateReview } = require("../../utils/validation");

// Get all reviews of the current user
router.get("/current", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const reviews = await Review.findAll({
    where: {
      userId: currentUser,
    },
  }); // can't manipulate this

  let reviewObj;
  for (let review of reviews) {
    // this allows us to manipulate the keys inside reviews.
    reviewObj = review.dataValues;

    const user = await User.findAll({
      where: {
        id: review.id,
      },
      attributes: ["id", "firstName", "lastName"],
    });
    let userDataValues;
    for (let use of user) {
      userDataValues = use.dataValues;
    }
    reviewObj.User = userDataValues;

    const spot = await Spot.findAll({
      where: {
        ownerId: currentUser,
      },
    });
    let spotValues;
    for (let values of spot) {
      spotValues = values.dataValues;

      reviewObj.Spot = spotValues;

      const spotImage = await SpotImage.findAll({
        where: {
          spotId: currentUser,
        },
      });
      let url;
      for (let key of spotImage) {
        url = key.url;
      }
      spotValues.previewImage = url;

      const imageReviews = await ReviewImage.findAll({
        where: {
          reviewId: currentUser,
        },
        attributes: ["id", "url"],
      });
      reviewObj.ReviewImages = imageReviews;
    }
  }

  const someObj = { Reviews: reviews };
  res.status(200).json(someObj);
});


// Add an image based on the review's id
router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const currentUser = req.user.id;
  const { url } = req.body;
  const { reviewId } = req.params;
  const review = await Review.findByPk(reviewId);
  if (!review) {
    res.status(404).json({
      message: "Review couldn't be found",
      statusCode: 404,
    });
  }

  const userId = review.userId;
  if (currentUser !== userId){
    res.status(403).json({
      message: "Forbidden",
      statusCode: 403
    })
  }

  const reviewImages = await ReviewImage.findAll({
    where: {
       reviewId: reviewId
      },
  });

  if (reviewImages.length >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
      statusCode: 403,
    });
  }

  const newImage = await ReviewImage.create({ url, reviewId: reviewId});
    res.status(200).json({
      id: newImage.id,
      url: url
    });
});


// Edit a review
router.put('/:reviewId', requireAuth, validateReview, async (req, res) => {
    const { reviewId } = req.params;
    const currentUser = req.user.id;
    const { review, stars } = req.body;

    const reviews = await Review.findByPk(reviewId);

    if (!reviews){
        res.status(404).json({
            message: "Review couldn't be found",
            statusCode: 404
        })
    }

    // Review must belong to the current user
    if (currentUser !== reviews.dataValues.userId){
        res.status(403).json({
            message: "Forbidden",
            statusCode: 403
        })
    } else {
        reviews.update(req.body);
        res.status(200).json(reviews)
    }
})


// Delete a review
router.delete('/:reviewId', requireAuth, async (req, res) =>{
    const { reviewId } = req.params;
    const currentUser = req.user.id;
    const reviews = await Review.findByPk(reviewId);

    if (!reviews){
        res.status(404).json({
            message: "Review couldn't be found",
            statusCode: 404
        })
    }

    if (currentUser === reviews.dataValues.userId){
        reviews.destroy();
        res.status(200).json({
            message: "Successfully deleted",
            statusCode: 200
        })
    } else {
      res.status(403).json({
        message: "Forbidden",
        statusCode: 403
      })
    }
});




module.exports = router;
