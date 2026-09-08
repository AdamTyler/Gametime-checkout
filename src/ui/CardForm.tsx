import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  cvcLength,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  numberLength,
  onlyDigits,
  validateCard,
  type CardFields,
} from '../domain/card';

type Props = {
  disabled: boolean;
  onPay: (fields: CardFields) => void;
};

export function CardForm({ disabled, onPay }: Props) {
  const [fields, setFields] = useState<CardFields>({
    number: '',
    expiry: '',
    cvc: '',
  });
  const [touched, setTouched] = useState<
    Partial<Record<keyof CardFields, boolean>>
  >({});
  const expiryRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);

  const brand = detectBrand(onlyDigits(fields.number));
  const errors = validateCard(fields);
  const valid = Object.keys(errors).length === 0;

  // Errors are computed on every keystroke but only shown once you've left the field,
  // so nothing yells at you mid-typing. After that they clear as you fix them.
  const show = (key: keyof CardFields) =>
    touched[key] ? errors[key] : undefined;
  const blur = (key: keyof CardFields) => () =>
    setTouched((t) => ({ ...t, [key]: true }));

  function onNumber(text: string) {
    const digits = onlyDigits(text).slice(
      0,
      numberLength(detectBrand(onlyDigits(text))),
    );
    setFields((f) => ({
      ...f,
      number: formatCardNumber(digits, detectBrand(digits)),
    }));
    if (digits.length === numberLength(detectBrand(digits)))
      expiryRef.current?.focus();
  }

  function onExpiry(text: string) {
    const digits = onlyDigits(text).slice(0, 4);
    setFields((f) => ({ ...f, expiry: formatExpiry(digits) }));
    if (digits.length === 4) cvcRef.current?.focus();
  }

  function onCvc(text: string) {
    setFields((f) => ({
      ...f,
      cvc: onlyDigits(text).slice(0, cvcLength(brand)),
    }));
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Card number</Text>
          {brand !== 'unknown' && <Text style={styles.brand}>{brand}</Text>}
        </View>
        <TextInput
          style={[styles.input, show('number') && styles.inputError]}
          value={fields.number}
          onChangeText={onNumber}
          onBlur={blur('number')}
          keyboardType='number-pad'
          textContentType='creditCardNumber'
          autoComplete='cc-number'
          placeholder='4242 4242 4242 4242'
          returnKeyType='next'
          onSubmitEditing={() => expiryRef.current?.focus()}
        />
        {show('number') && <Text style={styles.error}>{errors.number}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.half]}>
          <Text style={styles.label}>Expiry</Text>
          <TextInput
            ref={expiryRef}
            style={[styles.input, show('expiry') && styles.inputError]}
            value={fields.expiry}
            onChangeText={onExpiry}
            onBlur={blur('expiry')}
            keyboardType='number-pad'
            textContentType='creditCardExpiration'
            autoComplete='cc-exp'
            placeholder='MM/YY'
            returnKeyType='next'
            onSubmitEditing={() => cvcRef.current?.focus()}
          />
          {show('expiry') && <Text style={styles.error}>{errors.expiry}</Text>}
        </View>

        <View style={[styles.field, styles.half]}>
          <Text style={styles.label}>CVC</Text>
          <TextInput
            ref={cvcRef}
            style={[styles.input, show('cvc') && styles.inputError]}
            value={fields.cvc}
            onChangeText={onCvc}
            onBlur={blur('cvc')}
            keyboardType='number-pad'
            textContentType='creditCardSecurityCode'
            autoComplete='cc-csc'
            placeholder={brand === 'amex' ? '1234' : '123'}
            returnKeyType='done'
          />
          {show('cvc') && <Text style={styles.error}>{errors.cvc}</Text>}
        </View>
      </View>

      <Pressable
        style={[styles.pay, (!valid || disabled) && styles.payDisabled]}
        disabled={!valid || disabled}
        onPress={() => onPay(fields)}
      >
        <Text style={styles.payText}>Pay</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
  },
  field: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: '#555',
  },
  brand: {
    fontSize: 13,
    color: '#555',
    textTransform: 'capitalize',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#c0392b',
  },
  error: {
    fontSize: 12,
    color: '#c0392b',
  },
  pay: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  payDisabled: {
    opacity: 0.4,
  },
  payText: {
    color: '#fff',
    fontWeight: '600',
  },
});
