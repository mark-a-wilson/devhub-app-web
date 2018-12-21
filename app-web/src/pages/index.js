import React, { Component } from 'react';
import { graphql } from 'gatsby';
import shortid from 'shortid';
import { connect } from 'react-redux';
import { Flag } from 'flag';

import * as actions from '../store/actions/actions';
import { groupBy } from '../utils/dataMassager';
import { GITHUB_ISSUES_ROUTE } from '../constants/routes';
import { REACT_SCROLL } from '../constants/ui';
import { DEFAULT_FILTERS } from '../constants/filterGroups';
import styles from './index.module.css';
// components
import { Element } from 'react-scroll';
import Layout from '../hoc/Layout';
import PrimaryFilter from '../components/PrimaryFilter/PrimaryFilter';
import SecondaryFilter from '../components/SecondaryFilter/SecondaryFilter';
import Cards from '../components/Cards/Cards';
import CardFilterButton from '../components/CardFilterButton/CardFilterButton';

export class Index extends Component {
  componentDidMount() {
    // flatted nodes from graphql
    const nodes = this.props.data.allDevhubSiphon.edges.map(n => n.node);
    this.props.loadSiphonNodes(nodes);
  }

  componentWillUnmount() {
    this.props.hideWelcomeMessage();
  }

  render() {
    const { nodes, menuToggled, toggleMenu, displayWelcome, filters } = this.props;
    let mappedSiphonNodes = [];
    if (nodes && nodes.length) {
      mappedSiphonNodes = nodes
        .filter(node => node.childMarkdownRemark && !node.childMarkdownRemark.frontmatter.pageOnly)
        .map(node => ({
          ...node.unfurl,
          resourcePath: node.resource.path,
          collectionName: node.collection.name,
          sourcePath: node.source.sourcePath,
          resourceType: node.resource.type,
          owner: node.owner,
          repository: node.source.name,
        }));
    }
    // group nodes into collections for display purposes
    const groupedSiphonData = groupBy(mappedSiphonNodes, 'collectionName');
    // convert grouped data into their 'collected' cards containers
    const SiphonResources = groupedSiphonData.map(ghData => (
      <Cards key={shortid.generate()} topic={ghData.collectionName} cards={ghData.data} />
    ));
    // group filter groups by there title
    let groupedFilters = groupBy(filters, 'title');
    // map the data property that is created from groupBy to filters which is needed
    // for the FilterGroup component within Secondary Filter
    groupedFilters = groupedFilters.map(fg => ({ ...fg, filters: fg.data }));

    return (
      <Layout showHamburger hamburgerClicked={toggleMenu}>
        <Flag name="features.sourceFiltering">
          <PrimaryFilter />
          {menuToggled ? <PrimaryFilter mobile /> : null}
        </Flag>
        <main role="main" className={[styles.Main, 'container'].join(' ')}>
          {displayWelcome ? (
            <section className="jumbotron text-center">
              <h1 className="jumbotron-heading">Welcome.</h1>

              <h3> We are here to help.</h3>

              <p className="lead">
                This is the front door to the developer community of the BC Government. The aim of
                the DevHub is to help developers and digital product teams learn new skills and
                discover resources to use on their journeys of creating amazing applications for
                government.
              </p>
              <p>
                In the future, we plan to offer a variety of cool and useful ways to organize and
                navigate DevHub resources. For now, you can tell us who you are below and we'll
                tailor the set of resources shown just for you.
              </p>

              <div className={'d-flex justify-content-center align-items-center'}>
                <CardFilterButton
                  scrollToTarget={REACT_SCROLL.ELEMENTS.CARDS_CONTAINER}
                  filterKey={DEFAULT_FILTERS.PERSONA_DEVELOPER.key}
                  className={['btn btn-outline-primary', styles.PersonaButton].join(' ')}
                >
                  I'm a Developer
                </CardFilterButton>
                <CardFilterButton
                  scrollToTarget={REACT_SCROLL.ELEMENTS.CARDS_CONTAINER}
                  filterKey={DEFAULT_FILTERS.PERSONA_DESIGNER.key}
                  className={['btn btn-outline-success', styles.PersonaButton].join(' ')}
                >
                  I'm a Designer
                </CardFilterButton>
              </div>

              <blockquote className="blockquote">
                <p className="mb-0">Thanks for visiting!</p>
                <footer className="blockquote-footer">The DevHub Team.</footer>
              </blockquote>

              <p className="text-muted">
                PS. If you’d like to comment, offer a suggestion or ask a question you can find us
                by opening an issue in our <a href={GITHUB_ISSUES_ROUTE}>GitHub</a> repository.
              </p>
            </section>
          ) : null}

          <Element name={REACT_SCROLL.ELEMENTS.CARDS_CONTAINER}>
            <div
              className={[styles.ListContainer, displayWelcome ? '' : styles.NoWelcome].join(' ')}
            >
              <SecondaryFilter filterGroups={groupedFilters} />
              <SecondaryFilter filterGroups={groupedFilters} mobile />
              <div className={styles.CardContainer}>
                <Flag name="features.githubResourceCards">{SiphonResources}</Flag>
              </div>
            </div>
          </Element>
        </main>
      </Layout>
    );
  }
}

export const resourceQuery = graphql`
  query resourceQuery {
    allDevhubSiphon(filter: { internal: { mediaType: { eq: "text/markdown" } } }) {
      edges {
        node {
          id
          attributes {
            persona
          }
          collection {
            name
            type
          }
          source {
            displayName
            sourcePath
            type
            name
          }
          owner
          resource {
            path
            type
          }
          unfurl {
            title
            description
            type
            image
            author
          }
          childMarkdownRemark {
            frontmatter {
              pageOnly
            }
          }
        }
      }
    }
  }
`;

const mapStateToProps = state => {
  return {
    nodes: state.siphon.secondaryFilteredNodes,
    menuToggled: state.ui.mainNavigationToggled,
    filters: state.siphon.filters,
    displayWelcome: !state.ui.welcomePanelWasViewed,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    loadSiphonNodes: nodes => dispatch(actions.loadSiphonNodes(nodes)),
    toggleMenu: () => dispatch(actions.toggleMainNavigation()),
    hideWelcomeMessage: () => dispatch(actions.setWelcomePanelViewed(true)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Index);
