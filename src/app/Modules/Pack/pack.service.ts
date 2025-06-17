import { IPack } from "./pack.inteface";
import { Pack } from "./pack.module";

const createPackIntoDB = async( payload : IPack )=>{
    const result = await Pack.create(payload)
    return result
}

export const packService = {
    createPackIntoDB
}