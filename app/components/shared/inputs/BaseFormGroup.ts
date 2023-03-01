import { Prop } from 'vue-property-decorator';
import Vue from 'vue';
// @ts-expect-error
import { ErrorField } from 'vee-validate';
import { EInputType, IInputMetadata } from './index';
import { BaseInput } from './BaseInput';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

/**
 * Base class for input-component layouts
 */
export default abstract class BaseFormGroup extends BaseInput<any, IInputMetadata> {
  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  inputErrors: ErrorField[] = [];

  /**
   * contains ValidatedForm if exist
   */
  protected form: ValidatedForm = (() => {
    let comp: Vue = this;
    do {
      comp = comp.$parent;
    } while (comp && !(comp instanceof ValidatedForm));
    return comp as ValidatedForm;
  })();

  created() {
    if (!this.form) return;
    this.form.validated.subscribe(errors => {
      this.inputErrors = errors.filter(error => error.field === this.uuid);
    });
  }

  get formInputMetadata() {
    const options = this.options;
    if (!options.type) return {};
    const inputMetadata = options;

    // FormGroup handle the render of the FormInput title
    // so remove the title from FormInput metadata
    delete inputMetadata.title;
    delete inputMetadata.tooltip;
    delete inputMetadata.description;
    return inputMetadata;
  }

  getOptions() {
    const options = super.getOptions();
    options.uuid = this.uuid;
    options.type = this.type || options.type;
    options.title = this.title || options.title;
    return options;
  }
}
