import React, { Component } from 'react';
import moment from 'moment';
import api from '../../services/api';

import logo from '../../assets/logo.png';

import { Container, Form } from './styles';

import CompareList from '../../components/CompareList';

export default class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      repositoryError: false,
      repositoryInput: '',
      repositories: [
      ],
    };
  }

  async componentDidMount() {
    this.setState({ loading: true });

    this.setState({ loading: false, repositories: await this.getLocalRepositories() });
  }

  handleAddRepository = async (e) => {
    const { repositories, repositoryInput } = this.state;

    e.preventDefault();

    try {
      const { data: repository } = await api.get(`/repos/${repositoryInput}`);

      repository.lastCommit = moment(repository.pushed_at).fromNow();

      this.setState({
        repositoryInput: '',
        repositories: [...repositories, repository],
        repositoryError: false,
      });

      const localRepositories = await this.getLocalRepositories();

      await localStorage.setItem(
        '@GitCompare:repositories',
        JSON.stringify([...localRepositories, repository]),
      );
    } catch (error) {
      this.setState({ repositoryError: true });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRemoveRepository = async (id) => {
    const { repositories } = this.state;

    const updatedRepositories = repositories.filter((repository) => repository.id !== id);

    this.setState({ repositories: updatedRepositories });

    await localStorage.setItem('@GitCompare:repositories', JSON.stringify(updatedRepositories));
  }

  handleUpdateRepository = async (id) => {
    const { repositories } = this.state;

    const repository = repositories.find((repo) => repo.id === id);

    try {
      const { data } = await api.get(`/repos/${repository.full_name}`);

      data.lastCommit = moment(repository.pushed_at).fromNow();

      this.setState({
        repositoryInput: '',
        repositories: repositories.map((repo) => (repo.id === data.id ? data : repo)),
        repositoryError: false,
      });

      await localStorage.setItem(
        '@GitCompare:repositories',
        JSON.stringify(repositories),
      );
    } catch (error) {
      this.setState({ repositoryError: true });
    }
  }

  getLocalRepositories = async () => JSON.parse(await localStorage.getItem('@GitCompare:repositories')) || [];

  render() {
    const {
      repositories, repositoryInput, repositoryError, loading,
    } = this.state;

    return (
      <Container className="App">
        <img src={logo} alt="Github Compare" />

        <Form withError={repositoryError} onSubmit={this.handleAddRepository}>
          <input
            type="text"
            placeholder="usuário/repositório"
            value={repositoryInput}
            onChange={(e) => this.setState({ repositoryInput: e.target.value })}
          />
          <button type="submit">{loading ? <i className="fa fa-spinner fa-pulse" /> : 'Ok'}</button>
        </Form>

        <CompareList
          repositories={repositories}
          onClickRemove={this.handleRemoveRepository}
          onClickUpdate={this.handleUpdateRepository}
        />
      </Container>
    );
  }
}
