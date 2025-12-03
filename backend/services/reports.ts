import { BillModel } from "../models/Bill"
import { CommodityModel } from "../models/Commodity"
import { UserModel } from "../models/User"
import mongoose from "mongoose"

export interface DateWiseReport {
  date: string
  totalBills: number
  totalAmount: number
  totalWeight: number
  commodities: { name: string; count: number; amount: number }[]
}

export interface FarmerWiseReport {
  farmerName: string
  totalBills: number
  totalAmount: number
  totalWeight: number
  commodities: { name: string; count: number; amount: number }[]
}

export interface CommodityWiseReport {
  commodityName: string
  totalBills: number
  totalAmount: number
  totalWeight: number
  farmers: { name: string; count: number; amount: number }[]
}

export class ReportsService {
  static async getDateWiseReport(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<DateWiseReport[]> {
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : 
                      groupBy === 'week' ? '%Y-%U' : '%Y-%m'
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'draft' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$finalPayable' },
          totalWeight: { $sum: '$totalAdjustedWeight' },
          commodities: {
            $push: {
              name: '$commodityName',
              amount: '$finalPayable'
            }
          }
        }
      },
      {
        $project: {
          date: '$_id',
          totalBills: 1,
          totalAmount: 1,
          totalWeight: 1,
          commodities: {
            $reduce: {
              input: '$commodities',
              initialValue: [],
              in: {
                $let: {
                  vars: {
                    existing: {
                      $filter: {
                        input: '$$value',
                        cond: { $eq: ['$$this.name', '$$this.name'] }
                      }
                    }
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: '$$existing' }, 0] },
                      then: {
                        $map: {
                          input: '$$value',
                          in: {
                            $cond: {
                              if: { $eq: ['$$this.name', '$$this.name'] },
                              then: {
                                name: '$$this.name',
                                count: { $add: ['$$this.count', 1] },
                                amount: { $add: ['$$this.amount', '$$this.amount'] }
                              },
                              else: '$$this'
                            }
                          }
                        }
                      },
                      else: {
                        $concatArrays: [
                          '$$value',
                          [{ name: '$$this.name', count: 1, amount: '$$this.amount' }]
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]
    
    return await BillModel.aggregate(pipeline)
  }
  
  static async getFarmerWiseReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<FarmerWiseReport[]> {
    const matchStage: any = { status: { $ne: 'draft' } }
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate }
    }
    
    const pipeline = [
      { $match: matchStage },
      { $unwind: '$farmers' },
      {
        $group: {
          _id: '$farmers.name',
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$farmers.farmerAmount' },
          totalWeight: { $sum: '$farmers.totalAdjustedWeight' },
          commodities: {
            $push: {
              name: '$commodityName',
              amount: '$farmers.farmerAmount'
            }
          }
        }
      },
      {
        $project: {
          farmerName: '$_id',
          totalBills: 1,
          totalAmount: 1,
          totalWeight: 1,
          commodities: {
            $reduce: {
              input: '$commodities',
              initialValue: [],
              in: {
                $let: {
                  vars: {
                    existing: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$$value',
                            cond: { $eq: ['$$this.name', '$$this.name'] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $cond: {
                      if: { $ne: ['$$existing', null] },
                      then: {
                        $map: {
                          input: '$$value',
                          in: {
                            $cond: {
                              if: { $eq: ['$$this.name', '$$this.name'] },
                              then: {
                                name: '$$this.name',
                                count: { $add: ['$$this.count', 1] },
                                amount: { $add: ['$$this.amount', '$$this.amount'] }
                              },
                              else: '$$this'
                            }
                          }
                        }
                      },
                      else: {
                        $concatArrays: [
                          '$$value',
                          [{ name: '$$this.name', count: 1, amount: '$$this.amount' }]
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]
    
    return await BillModel.aggregate(pipeline)
  }
  
  static async getCommodityWiseReport(
    startDate?: Date,
    endDate?: Date
  ): Promise<CommodityWiseReport[]> {
    const matchStage: any = { status: { $ne: 'draft' } }
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate }
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$commodityName',
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$finalPayable' },
          totalWeight: { $sum: '$totalAdjustedWeight' },
          farmers: {
            $push: {
              $map: {
                input: '$farmers',
                as: 'farmer',
                in: {
                  name: '$$farmer.name',
                  amount: '$$farmer.farmerAmount'
                }
              }
            }
          }
        }
      },
      {
        $project: {
          commodityName: '$_id',
          totalBills: 1,
          totalAmount: 1,
          totalWeight: 1,
          farmers: {
            $reduce: {
              input: { $reduce: { input: '$farmers', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
              initialValue: [],
              in: {
                $let: {
                  vars: {
                    existing: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$$value',
                            cond: { $eq: ['$$this.name', '$$this.name'] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    $cond: {
                      if: { $ne: ['$$existing', null] },
                      then: {
                        $map: {
                          input: '$$value',
                          in: {
                            $cond: {
                              if: { $eq: ['$$this.name', '$$this.name'] },
                              then: {
                                name: '$$this.name',
                                count: { $add: ['$$this.count', 1] },
                                amount: { $add: ['$$this.amount', '$$this.amount'] }
                              },
                              else: '$$this'
                            }
                          }
                        }
                      },
                      else: {
                        $concatArrays: [
                          '$$value',
                          [{ name: '$$this.name', count: 1, amount: '$$this.amount' }]
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]
    
    return await BillModel.aggregate(pipeline)
  }
  
  static async getDashboardStats(startDate?: Date, endDate?: Date) {
    const matchStage: any = { status: { $ne: 'draft' } }
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate }
    }
    
    const [billStats, commodityCount, userCount] = await Promise.all([
      BillModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalBills: { $sum: 1 },
            totalAmount: { $sum: '$finalPayable' },
            totalWeight: { $sum: '$totalAdjustedWeight' },
            avgAmount: { $avg: '$finalPayable' }
          }
        }
      ]),
      CommodityModel.countDocuments(),
      UserModel.countDocuments({ status: 'active' })
    ])
    
    return {
      totalBills: billStats[0]?.totalBills || 0,
      totalAmount: billStats[0]?.totalAmount || 0,
      totalWeight: billStats[0]?.totalWeight || 0,
      avgAmount: billStats[0]?.avgAmount || 0,
      totalCommodities: commodityCount,
      totalUsers: userCount
    }
  }
}