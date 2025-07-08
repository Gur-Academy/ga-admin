pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Starting checkout...'
                checkout scm
                echo 'Checkout completed'
                sh 'pwd'
                sh 'ls -la'
            }
        }

        stage('Set Environment') {
            steps {
                withEnv([
                    "JAVA_HOME=${tool 'jdk-21'}",
                    "MAVEN_HOME=${tool 'maven3'}",
                    "PATH=${tool 'jdk-21'}/bin:${env.PATH}",
                    "GITHUB_TOKEN=${credentials('jenkins-cicd')}",
                    "REPO_OWNER=Gur-Academy",
                    "REPO_NAME=ga-admin"
                ]) {
                    echo "Environment variables set"
                    echo "JAVA_HOME: ${env.JAVA_HOME}"
                    echo "MAVEN_HOME: ${env.MAVEN_HOME}"
                }
            }
        }

        stage('Build') {
            steps {
                echo 'Starting build...'
                withEnv([
                    "JAVA_HOME=${tool 'jdk-21'}",
                    "MAVEN_HOME=${tool 'maven3'}",
                    "PATH=${tool 'jdk-21'}/bin:${env.PATH}",
                    "GITHUB_TOKEN=${credentials('jenkins-cicd')}",
                    "REPO_OWNER=Gur-Academy",
                    "REPO_NAME=ga-admin"
                ]) {
                    sh "${MAVEN_HOME}/bin/mvn clean install -DskipTests"
                    echo 'Build completed'
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Starting tests...'
                withEnv([
                    "JAVA_HOME=${tool 'jdk-21'}",
                    "MAVEN_HOME=${tool 'maven3'}",
                    "PATH=${tool 'jdk-21'}/bin:${env.PATH}",
                    "GITHUB_TOKEN=${credentials('jenkins-cicd')}",
                    "REPO_OWNER=Gur-Academy",
                    "REPO_NAME=ga-admin"
                ]) {
                    sh "${MAVEN_HOME}/bin/mvn test"
                    echo 'Tests completed'
                }
            }
        }

        stage('Package') {
            steps {
                echo 'Starting package...'
                withEnv([
                    "JAVA_HOME=${tool 'jdk-21'}",
                    "MAVEN_HOME=${tool 'maven3'}",
                    "PATH=${tool 'jdk-21'}/bin:${env.PATH}",
                    "GITHUB_TOKEN=${credentials('jenkins-cicd')}",
                    "REPO_OWNER=Gur-Academy",
                    "REPO_NAME=ga-admin"
                ]) {
                    sh "${MAVEN_HOME}/bin/mvn package"
                    echo 'Package completed'
                }
            }
        }

        stage('Notify PR Status') {
            steps {
                echo 'Starting PR notification...'
                withEnv([
                    "JAVA_HOME=${tool 'jdk-21'}",
                    "MAVEN_HOME=${tool 'maven3'}",
                    "PATH=${tool 'jdk-21'}/bin:${env.PATH}",
                    "GITHUB_TOKEN=${credentials('jenkins-cicd')}",
                    "REPO_OWNER=Gur-Academy",
                    "REPO_NAME=ga-admin"
                ]) {
                    script {
                        def commitSha = sh(
                            script: "git rev-parse HEAD",
                            returnStdout: true
                        ).trim()

                        def state = currentBuild.currentResult == 'SUCCESS' ? 'success' : 'failure'
                        def description = currentBuild.currentResult == 'SUCCESS' ? 'Build and Tests Passed' : 'Build or Tests Failed'
                        def context = 'Jenkins CI'

                        sh """
                        curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" \\
                             -d '{
                                  "state": "${state}",
                                  "target_url": "${env.BUILD_URL}",
                                  "description": "${description}",
                                  "context": "${context}"
                                  }' \\
                             https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/statuses/${commitSha}
                        """
                    }
                }
            }
        }
            }
        }
    }


}
