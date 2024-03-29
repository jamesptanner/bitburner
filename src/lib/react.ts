import ReactNamespace from 'react/index';
import ReactDomNamespace from 'react-dom';

const React = window.React as typeof ReactNamespace;
const ReactDom = window.ReactDOM as typeof ReactDomNamespace;


export default React;
export {
  ReactDom;
}