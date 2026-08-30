import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import EvaluationBuilder from './EvaluationBuilder.vue';

describe('EvaluationBuilder con límite de preguntas', () => {
  test('no permite agregar más preguntas que el máximo configurado', async () => {
    const wrapper = mount(EvaluationBuilder, {
      props: {
        modelValue: { preguntas: [] },
        maxQuestions: 2,
        exactQuestions: 2,
        'onUpdate:modelValue': valor => wrapper.setProps({ modelValue: valor })
      }
    });

    const boton = wrapper.get('.builder-head button');
    await boton.trigger('click');
    await boton.trigger('click');

    expect(wrapper.findAll('.question-card')).toHaveLength(2);
    expect(wrapper.get('.question-count').text()).toBe('2 de 2 preguntas');
    expect(boton.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
});
