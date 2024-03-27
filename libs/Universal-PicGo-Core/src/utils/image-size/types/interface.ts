import { win } from "universal-picgo-store"

export type ISize = {
  width: number | undefined
  height: number | undefined
  orientation?: number
  type?: string
}

export type ISizeCalculationResult = {
  images?: ISize[]
} & ISize

export type IImage = {
  validate: (input: typeof win.Uint8Array) => boolean
  calculate: (input: typeof win.Uint8Array, filepath?: string) => ISizeCalculationResult
}
