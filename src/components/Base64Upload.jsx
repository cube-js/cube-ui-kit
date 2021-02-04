import React, { useState } from 'react';
import Button from './Button';
import Block from './Block';
import Text from './Text';
import styled from 'styled-components';

const DEFAULT_STYLES = {
  display: 'inline-flex',
  padding: '.75x 1x',
  gap: '1x',
  flow: 'row',
  items: 'center',
};

export default styled(
  React.forwardRef(({ type, onInput, ...props }, ref) => {
    const [file, setFile] = useState();
    const [error, setError] = useState('');

    function onInputFile(e) {
      if (!e.target) return;

      const localFile = e.target.files[0];
      const reader = new FileReader();

      setError('');

      if (!localFile) return;

      if (!localFile.name.endsWith('.json')) {
        setError('Incorrect format. JSON file is required');

        return;
      }

      reader.onload = function () {
        /**
         * @type {string}
         */
        const text = reader.result;

        let base64text;

        try {
          JSON.parse(text);

          base64text = btoa(text);
        } catch (e) {
          setError('Invalid JSON file');

          console.error(e);

          return;
        }

        onInput &&
          onInput({
            encoded: base64text,
            raw: JSON.parse(text),
          });

        setFile(localFile.name);
      };

      try {
        reader.readAsText(localFile);
      } catch (e) {
        setError('Invalid file');
      }
    }

    return (
      <>
        <Button
          tag="button"
          defaultStyles={DEFAULT_STYLES}
          {...props}
          ref={ref}
        >
          <Block
            radius="round"
            fill="#purple.10"
            color="#dark-02"
            padding=".5x 1x"
          >
            Choose file
          </Block>
          <Block color="#dark-04">{file || 'No file selected'}</Block>
          <input
            type="file"
            name="base64"
            onInput={onInputFile}
            accept=".json"
          />
        </Button>
        {error && <Text.Danger color="danger">{error}</Text.Danger>}
      </>
    );
  }),
)`
  appearance: none;
  cursor: pointer;
  outline: none;

  & input {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  && {
    border: var(--border-width) solid rgba(var(--dark-02-color-rgb), 0.1);
  }

  &&:not([data-is-hovered]) {
    background: rgba(var(--purple-color), 0);
  }

  &&[data-is-hovered] {
    background: rgba(var(--purple-color), 0.1);
  }
`;
