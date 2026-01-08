import { useState, useEffect, type FocusEvent, type KeyboardEvent } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

interface NumberInputProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
    value: number;
    onChange: (value: number) => void;
    decimalPlaces?: number;
}

export default function NumberInput({ value, onChange, decimalPlaces = 2, ...props }: NumberInputProps) {
    // Internal string state to allow intermediate invalid states (like "10.")
    const [strValue, setStrValue] = useState(value.toFixed(decimalPlaces));

    // Sync from parent if parent changes externally (and we are not focused/typing essentially)
    // But basic sync is good.
    useEffect(() => {
        // Only update if the number value is significantly different from our current parsed value
        // or if we want to enforce canonical representation on external update.
        // To avoid fighting with the user while typing, we might only do this on blur?
        // But if the robot moves (external update), we want to see it.
        // We will trust that if the user is typing, the parent won't be spamming updates 
        // unless they are unrelated.
        // A simple check: if parseFloat(strValue) !== value
        if (Math.abs(parseFloat(strValue) - value) > Math.pow(10, -decimalPlaces - 1)) {
            setStrValue(value.toFixed(decimalPlaces));
        }
    }, [value, decimalPlaces]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Replace comma with dot
        val = val.replace(/,/g, '.');
        setStrValue(val);
    };

    const commit = () => {
        let num = parseFloat(strValue);
        if (isNaN(num)) {
            // Revert to last good value
            setStrValue(value.toFixed(decimalPlaces));
        } else {
            // Round to decent precision to avoid float noise if needed, 
            // but the parent might want raw.
            // Let's just pass parsed float.
            // also re-format local string to look clean
            // setStrValue(num.toFixed(decimalPlaces)); // Optional: auto-format on blur
            onChange(num);
        }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        commit();
        if (props.onBlur) props.onBlur(e);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur(); // Trigger blur to commit
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        e.target.select();
        if (props.onFocus) props.onFocus(e);
    };

    return (
        <TextField
            {...props}
            value={strValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            // Use type="text" to fully control the parsing of "." and ","
            type="text"
        />
    );
}
