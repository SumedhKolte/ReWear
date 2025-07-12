const pool = require('../config/database');

class PriceCalculatorService {
  static calculatePrice(listingData) {
    const {
      category,
      brand,
      originalPrice,
      purchaseDate,
      condition
    } = listingData;

    const basePrice = parseFloat(originalPrice);
    const ageInMonths = this.calculateAgeInMonths(purchaseDate);
    
    // Age depreciation (varies by category)
    const depreciationRate = this.getDepreciationRate(category);
    const ageDepreciation = -(basePrice * (depreciationRate / 12) * ageInMonths);
    
    // Condition adjustment
    const conditionMultiplier = this.getConditionMultiplier(condition);
    const conditionAdjustment = (basePrice * conditionMultiplier) - basePrice;
    
    // Brand value adjustment
    const brandValue = this.getBrandValueAdjustment(brand, basePrice);
    
    // Market demand (simplified)
    const marketDemand = this.getMarketDemandAdjustment(category, basePrice);
    
    const finalCalculated = Math.max(
      basePrice + ageDepreciation + conditionAdjustment + brandValue + marketDemand,
      basePrice * 0.1 // Minimum 10% of original price
    );

    return {
      calculatedPrice: Math.round(finalCalculated),
      priceFactors: {
        basePrice: Math.round(basePrice),
        ageDepreciation: Math.round(ageDepreciation),
        conditionAdjustment: Math.round(conditionAdjustment),
        brandValue: Math.round(brandValue),
        marketDemand: Math.round(marketDemand),
        finalCalculated: Math.round(finalCalculated)
      }
    };
  }

  static calculateAgeInMonths(purchaseDate) {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    return Math.max(0, (now - purchase) / (1000 * 60 * 60 * 24 * 30));
  }

  static getDepreciationRate(category) {
    const rates = {
      "T-Shirt": 0.25,
      "Pants": 0.20,
      "Blazer": 0.15,
      "Dress": 0.20,
      "Jacket": 0.15,
      "Shoes": 0.30,
      "Accessories": 0.10
    };
    return rates[category] || 0.20;
  }

  static getConditionMultiplier(condition) {
    const multipliers = {
      'New with Tags': 0.85,
      'Like New': 0.75,
      'Excellent': 0.65,
      'Good': 0.50,
      'Fair': 0.35,
      'Poor': 0.20
    };
    return multipliers[condition] || 0.50;
  }

  static getBrandValueAdjustment(brand, basePrice) {
    const luxuryBrands = ["Gucci", "Louis Vuitton", "Prada", "Chanel"];
    const premiumBrands = ["Nike", "Adidas", "Levi's", "Calvin Klein"];
    
    if (luxuryBrands.includes(brand)) return basePrice * 0.15;
    if (premiumBrands.includes(brand)) return basePrice * 0.10;
    return basePrice * 0.05;
  }

  static getMarketDemandAdjustment(category, basePrice) {
    // Simplified market demand calculation
    const demandMultipliers = {
      "Sneakers": 0.10,
      "Denim Jacket": 0.08,
      "Basic Tee": -0.05,
      "Formal Dress": 0.05
    };
    return (demandMultipliers[category] || 0) * basePrice;
  }

  static calculateSwapComparison(initiatorListing, receiverListing) {
    const initiatorValue = initiatorListing.final_price || initiatorListing.calculated_price;
    const receiverValue = receiverListing.final_price || receiverListing.calculated_price;
    
    const priceDifference = initiatorValue - receiverValue;
    const extraPayment = Math.abs(priceDifference);
    const paymentDirection = priceDifference > 0 ? 'receiver_pays' : 'initiator_pays';
    
    return {
      initiatorValue,
      receiverValue,
      priceDifference,
      extraPayment: extraPayment > 5 ? extraPayment : 0, // Only charge if difference > $5
      paymentDirection: extraPayment > 5 ? paymentDirection : null,
      fairnessRatio: Math.min(initiatorValue, receiverValue) / Math.max(initiatorValue, receiverValue)
    };
  }
}

module.exports = PriceCalculatorService;
