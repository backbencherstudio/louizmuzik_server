import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { melodyService } from "./melody.service";

const getAllMelodyes = catchAsync(async (req, res) => {
    const result = await melodyService.getAllMelodyes();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get all melodies',
        data: result,
    });
});

const melodyCreateByProducer = catchAsync(async (req, res) => {
    const result = await melodyService.melodyCreateByProducer(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'melody created successfully',
        data: result,
    });
});

const getAllMelodesEachProducer = catchAsync(async (req, res) => {
    const result = await melodyService.getAllMelodesEachProducer(req.params.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'get single producer all melody successfully',
        data: result,
    });
});

const deleteMelodesEachProducer = catchAsync(async (req, res) => {
    const result = await melodyService.deleteMelodesEachProducer(req.params.melodyId, req.query.userId as string );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'melody deleted successfully',
        data: result,
    });
});

const selectFavoriteMelody = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    const userId = req.query.userId
    const result = await melodyService.selectFavoriteMelody(melodyId as string, userId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        // message: 'Melody has been successfully added to your favourites.',
        message: result.message,
        data: true,
    });
});

const eachMelodyDownloadCounter = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    await melodyService.eachMelodyDownloadCounter(melodyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Melody download successfully',
        data: true,
    });
});

const melodyPlay = catchAsync(async (req, res) => {
    const melodyId = req.params.melodyId
    await melodyService.melodyPlay(melodyId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Melody play',
        data: true,
    });
});



export const melodyController = {
    getAllMelodyes,
    melodyCreateByProducer,
    getAllMelodesEachProducer,
    deleteMelodesEachProducer,
    selectFavoriteMelody,
    eachMelodyDownloadCounter,
    melodyPlay
}