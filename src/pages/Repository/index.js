import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import api from '../../services/api';

import Container from '../../Components/Container';
import { Loading, Owner, IssueList } from './styles';

export default class Repository extends Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  // eslint-disable-next-line react/state-in-constructor
  state = {
    repository: {},
    issues: [],
    loading: true,
    status: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { status } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: `${status}`,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleStatusFilter = async (e) => {
    await this.setState({ status: e.target.value });
    console.log(this.state);
    this.handleReloadIssues();
  };

  handleReloadIssues = async () => {
    const { match } = this.props;
    const { status, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: `${status}`,
        per_page: 5,
        page,
      },
    });

    console.log(page, status);

    await this.setState({ issues: response.data });

    console.log(page, status);
  };

  handlePagination = async (op) => {
    const { page } = this.state;

    await this.setState({ page: op === 'next' ? page + 1 : page - 1 });

    await this.handleReloadIssues();
  };

  render() {
    const { repository, issues, loading } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <button onClick={this.handleStatusFilter} type="button" value="all">
            Todos
          </button>
          <button onClick={this.handleStatusFilter} type="button" value="open">
            Abertos
          </button>
          <button
            onClick={this.handleStatusFilter}
            type="button"
            value="closed"
          >
            fechados
          </button>
          {issues.map((issue) => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map((label) => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <button onClick={() => this.handlePagination('previous')} type="button">
          previous
        </button>
        <span>Página {this.state.page}</span>
        <button onClick={() => this.handlePagination('next')} type="button">
          next
        </button>
      </Container>
    );
  }
}
