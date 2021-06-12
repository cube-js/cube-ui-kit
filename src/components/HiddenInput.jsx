import styled from 'styled-components';

export const HiddenInput = styled.input`
  &&&&& {
    display: block;
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
    overflow: visible;
    box-sizing: border-box;
    padding: 0;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    opacity: 0.0001;
    z-index: 1;
    cursor: ${({ isButton }) => (isButton ? 'pointer' : 'default')};
    width: 100%;
    height: 100%;
  }
`;
