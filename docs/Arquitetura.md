# 🏗️ Visão de Arquitetura – Projeto Find Workers

## 🎯 Visão Geral

O projeto **Find Workers** é uma aplicação web monolítica que conecta trabalhadores autônomos a pessoas que precisam de pequenos serviços (ex.: jardinagem, manutenção doméstica, etc.). A arquitetura foi desenhada para ser simples, escalável e de fácil manutenção.

---

## 🧩 Principais Componentes

- **Frontend (EJS + HTML/CSS/JavaScript)**  
  - Renderização server-side com EJS.
  - Interações simples com JS puro e Bootstrap para estilização.

- **Backend (Node.js + Express)**  
  - Responsável por todas as regras de negócio.
  - Gerencia rotas, autenticação e comunicação com o banco.

- **Banco de Dados (PostgreSQL)**  
  - Armazena informações dos usuários, serviços, avaliações, etc.

- **CI/CD (GitHub Actions)**  
  - Automatiza testes e deploy contínuo para o ambiente de demonstração.

- **Hospedagem (Vercel)**  
  - Executa o servidor backend e serve as páginas web.

---

## 🔁 Fluxo de Dados

1. O cliente acessa o site e realiza o login ou cadastro.
2. O cliente cadastra um novo serviço no sistema.
3. O backend processa a solicitação, salva no banco e retorna a visualização.
4. Um trabalhador visualiza os serviços disponíveis e aceita um.
5. O backend atualiza o status do serviço.
6. Após a conclusão, o cliente avalia o trabalhador.
7. Toda interação é persistida no banco de dados e renderizada no frontend.

---

## 🧰 Tecnologias Utilizadas

| Camada        | Tecnologia                    |
|---------------|-------------------------------|
| Frontend      | EJS, HTML5, CSS3, Bootstrap   |
| Backend       | Node.js, Express              |
| Banco de Dados| SQLite (dev), PostgreSQL (prod) |
| CI/CD         | GitHub Actions                |
| Deploy        | Fly.io / Vercel / Heroku      |
| Versionamento | Git + GitHub                  |

---

## 📐 Diagrama da Arquitetura (sugestão visual)

> 

```mermaid
flowchart TD
    subgraph Frontend
        A[EJS Templates<br>HTML/CSS/JS/Bootstrap]
    end
    subgraph Backend
        B[Node.js<br>Express]
    end
    subgraph Database
        C[(PostgreSQL<br>)]
    end
    subgraph CI/CD
        D[GitHub Actions]
    end
    subgraph Deploy
        E[Vercel]
    end

    A -- HTTP Requests --> B
    B -- SQL Queries --> C
    D -- Automatiza Deploy --> E
    E -- Hospeda Backend/Frontend --> B
    E -- Serve Páginas --> A
```
---

Última atualização: 16/06/2025