import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveReactLayoutProfile,
  resolveVueLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";
import { indexApiSource } from "./codegen/apiIndex.template.js";
import { axiosBaseServiceSource, axiosInstanceSource } from "./codegen/axiosStack.template.js";
import { resolveContentTypeSource } from "./codegen/resolveContentType.template.js";
import { errorAdapterSource } from "./codegen/errorAdapter.template.js";
import { errorsCoreSource } from "./codegen/errorsCore.template.js";
import { fetchBaseServiceSource, fetchHttpClientSource } from "./codegen/fetchStack.template.js";
import { ofetchBaseServiceSource } from "./codegen/ofetchBaseService.template.js";
import { queryClientSource } from "./codegen/queryClient.template.js";
import { retrySource } from "./codegen/retry.template.js";
import {
  validationCodegenKind,
  withApiValidation,
} from "./codegen/validationProfile.js";
import { validationSource } from "./codegen/validation.template.js";

/**
 * Orchestrates generated API files under {@link resolveReactLayoutProfile}'s `apiRoot`.
 * Templates live in `./codegen/*`; transport (axios vs fetch) and validation profile are composed here.
 */
export class SharedApiPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react" || context.framework === "vue";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile =
      context.framework === "vue"
        ? resolveVueLayoutProfile(context.options.value.architecture)
        : resolveReactLayoutProfile(context.options.value.architecture);
    const root = profile.apiRoot;
    const axiosMode = context.options.value.httpClient === "axios";
    const ofetchMode = context.options.value.httpClient === "ofetch";
    const useTanStackQuery =
      context.options.value.asyncState === "tanstack-query";
    const validationKind = validationCodegenKind(
      context.options.value.validationLibrary,
    );
    const withValidation = withApiValidation(context.options.value.validationLibrary);

    composer.upsertFile(`${root}/resolveContentType.ts`, resolveContentTypeSource());
    composer.upsertFile(`${root}/errors.ts`, errorsCoreSource(validationKind));
    if (withValidation) {
      composer.upsertFile(`${root}/validation.ts`, validationSource());
    }
    composer.upsertFile(
      `${root}/errorAdapter.ts`,
      errorAdapterSource(axiosMode, validationKind),
    );

    if (useTanStackQuery) {
      composer.upsertFile(`${root}/retry.ts`, retrySource(validationKind));
      composer.upsertFile(
        `${root}/queryClient.ts`,
        queryClientSource(context.framework === "vue" ? "vue" : "react"),
      );
    }

    if (axiosMode) {
      composer.upsertFile(`${root}/axios.ts`, axiosInstanceSource());
      composer.upsertFile(`${root}/baseService.ts`, axiosBaseServiceSource(validationKind));
    } else if (ofetchMode) {
      composer.upsertFile(`${root}/baseService.ts`, ofetchBaseServiceSource(validationKind));
    } else {
      composer.upsertFile(`${root}/httpClient.ts`, fetchHttpClientSource());
      composer.upsertFile(`${root}/baseService.ts`, fetchBaseServiceSource(validationKind));
    }

    composer.upsertFile(
      `${root}/index.ts`,
      indexApiSource(context.options.value.httpClient, useTanStackQuery, withValidation),
    );
  }
}
