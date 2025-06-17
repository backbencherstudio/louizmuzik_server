import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { packService } from "./pack.service";


const getAllPackFromDB = catchAsync(async (req, res) => {
    const result = await packService.getAllPackFromDB();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get Pack successfully',
        data: result,
    });
});

const createPackIntoDB = catchAsync(async (req, res) => {
    const result = await packService.createPackIntoDB(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Pack created successfully',
        data: result,
    });
});

const getSingleUserAllPackFromDB = catchAsync(async (req, res) => {
    const result = await packService.getSingleUserAllPackFromDB(req.params.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get single user all Pack successfully',
        data: result,
    });
});

const selectFavoritePack = catchAsync(async (req, res) => {
    const packId = req.params.packId
    const userId = req.query.userId
    const result = await packService.selectFavoritePack(packId as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        // message: 'Melody has been successfully added to your favourites.',
        message: result.message,
        data: true,
    });
});

const deleteSinglePackByUser = catchAsync(async (req, res) => {
    const result = await packService.deleteSinglePackByUser(req.params.packId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Deleted Pack successfully',
        data: result,
    });
});


export const packController = {
    getAllPackFromDB,
    createPackIntoDB,
    getSingleUserAllPackFromDB,
    selectFavoritePack,
    deleteSinglePackByUser
}