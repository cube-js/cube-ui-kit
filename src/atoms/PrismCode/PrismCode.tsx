import { Component } from 'react';
import Prism from 'prismjs';

export class PrismCode extends Component {
  componentDidMount() {
    Prism.highlightAll();
  }

  componentDidUpdate() {
    Prism.highlightAll();
  }

  render() {
    return (
      <pre className="cube-prism-code" style={this.props.style}>
        <code className={`language-${this.props.language || 'javascript'}`}>
          {this.props.code}
        </code>
      </pre>
    );
  }
}
