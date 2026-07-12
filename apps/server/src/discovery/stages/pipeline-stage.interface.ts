export interface IPipelineStage<TInput, TOutput> {
  execute(input: TInput, options?: any): Promise<TOutput>;
}
