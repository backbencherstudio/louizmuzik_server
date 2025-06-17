import { IPack } from "./pack.inteface";
import { Pack } from "./pack.module";

const createPack = async( payload : IPack )=>{
    const result = await Pack.create(payload)
    return result
}

export const packService = {
    createPack
}