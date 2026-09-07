# GitHub 上传流程

这个项目的基本目标：
- 第一次把项目上传到 GitHub
- 后续需要新建分支、提交、推送时也能照着做

## 1. 初始化仓库

```powershell
git init
git branch -M main
git status
```

## 2. 第一次提交

```powershell
git add .
git commit -m "initial commit"
```

## 3. 关联 GitHub 仓库

先在 GitHub 网站上新建一个空仓库，然后把地址替换进去：

```powershell
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

## 4. 日常修改提交

先看改了什么：

```powershell
git status
git diff
```

然后提交：

```powershell
git add .
git commit -m "fix: 简单说明这次改动"
git push
```

## 5. 新建分支再做功能

适合做新功能、修 bug、试验改动。

```powershell
git switch -c feature/mobile-ui
```

改完后：

```powershell
git add .
git commit -m "feat: mobile layout"
git push -u origin feature/mobile-ui
```

## 6. 合并回主分支

如果你自己一个人维护，也可以这样回到主分支：

```powershell
git switch main
git pull
git merge feature/mobile-ui
git push
```

## 7. 这个项目的注意点

- 头像文件已经允许上传
- `data.db`、`.venv`、`.env` 仍然不建议上传
- 如果你以后换数据库，最好把本地测试数据和生产数据分开

