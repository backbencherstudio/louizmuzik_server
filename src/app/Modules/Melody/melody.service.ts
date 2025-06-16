import { Tmelody } from "./melody.interface"
import { Melody } from "./melody.module"

const melodyCreateByProducer = async (payload : Tmelody) =>{
    const result = await Melody.create(payload)
    return result
}

export const melodyService = {
    melodyCreateByProducer
}