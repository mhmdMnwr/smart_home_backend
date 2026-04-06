import { Prop , Schema, SchemaFactory} from "@nestjs/mongoose";
import { Document } from "mongoose";


export type HistoryDocument = History & Document;

@Schema({ timestamps: true })
export class History {

    @Prop({ required:true })
    device!: string;

    @Prop({ required:true })
    type!: string;

    @Prop({ required:true })
    value!: number;

    

}

export const HistorySchema = SchemaFactory.createForClass(History);