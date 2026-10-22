# 学校名单数据

本目录是学校排名使用的学校名单。编译时，`src/domain/organization/import.rs` 把这些文件嵌入二进制文件。运行 `import-schools` 命令后，名单作为 `school` 类型的组织写入数据库。收录规则见[大学排名设计](../../../docs/developers/school-ranking.mdx)。

名单的唯一来源是本目录。运营接口不能修改名单，所有修改都通过 PR 合并。所以 Git 历史就是名单的修改记录。

| 文件 | 内容 |
| --- | --- |
| `hipo.json` | [Hipo university-domains-list](https://github.com/hipo/university-domains-list) 的数据快照，即上游的 `world_universities_and_domains.json` |
| `hipo.commit` | 快照对应的上游提交，当前为 `603e10f51b67c6553b9bca9aecc0db4c2417ed10`（2026-09-22） |
| `LICENSE-hipo.txt` | Hipo 的 MIT 许可声明，即上游的 `LICENSE.txt` |
| `overrides.json` | 本地修正：中文名、合并、补充域名和排除域名 |

## 学校键

Hipo 的记录没有稳定 ID。导入工具用「学校键」识别一所学校，格式为 `<alpha_two_code>:<name>`，例如 `CN:Xi'an Jiaotong-Liverpool University`。学校键相同的记录自动合并，域名取并集。

首次导入一所学校时，导入工具为它分配一个 UUID。数据库按学校键保存这个 UUID，以后的导入沿用它，所以资源名 `organizations/{organization}` 保持不变。UUID 只保存在数据库中，没有写入仓库。所以新建的数据库会得到不同的学校 ID。

上游给一所学校改名后，学校键随之变化。下一次导入会创建一所新学校，并停用旧学校。停用的学校不接受新的认证，已有的认证在到期前继续计入旧学校。目前没有把认证迁移到新学校的工具。

## 本地修正

`overrides.json` 的 `schools` 对象以学校键为键。例如：

```json
{
  "schools": {
    "CN:Shanghai Jiao Tong University": {
      "chinese_name": "上海交通大学",
      "merge": ["CN:Shanghai Jiaotong University"]
    }
  }
}
```

每所学校可以使用以下字段，全部可选：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `chinese_name` | 字符串 | 中文名。Hipo 没有中文名字段，由维护者填写 |
| `merge` | 学校键列表 | 把其他记录合并到这所学校。被合并的记录不再单独出现 |
| `extra_domains` | 域名列表 | 补充的认证域名，例如学生邮箱的新域名 |
| `excluded_domains` | 域名列表 | 排除的域名，例如校友转发域名。匹配到排除项的邮箱不能认证 |

导入工具按以下规则检查修正文件，任何一条不满足，导入都会失败：

- 每个学校键都必须存在于快照中。本地修正不能新增学校。
- 不允许出现未知字段。
- 域名统一转为小写。名单域名开头的 `www.` 会被去掉，因为邮件地址不使用 `www.`。

当前的修正包括 39 个中文名和 1 项合并：上海交通大学在 Hipo 中的两条记录合并为一所学校。福建农林大学、约克大学等记录没有中文名，因为名称有歧义或者未核实。补充域名一项也没有，因为海南大学、杜伦大学等学校的新域名还没有核实。

维护者应该把本地修正同时提交给 Hipo 上游。上游合并后，下一次更新快照时，可以删除对应的本地修正。

## 导入

在本地数据库中导入名单：

```sh
cargo run --locked -- migrate
cargo run --locked -- import-schools
```

`import-schools` 读取与 `serve` 相同的配置，并要求数据库迁移已经完成。导入在一个事务中完成，可以重复运行。每次导入都会替换全部域名记录，并保留已有学校的 ID。

导入结束时，服务输出 `schools_imported` 日志，包含学校数、域名数和新建的学校数。每停用一所学校，服务输出一条 `school_retired` 警告，其中 `active_affiliations` 是仍在计入这所学校的认证数。维护者必须检查每条警告。

生产环境在部署新镜像后运行：

```sh
docker run --rm --env-file .env.production ghcr.io/aprilnea/boji-bizserver:<版本号> import-schools
```

## 更新快照

1. 选定 Hipo 的一个上游提交，记下完整的提交号。
2. 在本目录中运行以下命令：

    ```sh
    SHA=<完整提交号>
    BASE="https://raw.githubusercontent.com/Hipo/university-domains-list/$SHA"
    curl -fsSL "$BASE/world_universities_and_domains.json" -o hipo.json
    curl -fsSL "$BASE/LICENSE.txt" -o LICENSE-hipo.txt
    echo "$SHA" > hipo.commit
    ```

3. 把 `src/domain/organization/import.rs` 中 `the_bundled_list_parses` 测试的提交号改为新的提交号。
4. 运行 `cargo test --locked`。如果上游删除或改名了修正文件引用的学校，测试会失败，维护者需要修改 `overrides.json`。
5. 在本地数据库中运行 `import-schools`，检查 `school_retired` 警告。
6. 合并 PR 并部署后，在生产环境运行 `import-schools`。

## 许可证

`hipo.json` 来自 Hipo，按 MIT 许可证提供，版权归 Hipo 所有。提交或分发快照时必须保留 `LICENSE-hipo.txt`。这份数据不适用本仓库的 PolyForm Noncommercial License，根 `README.md` 的许可证排除列表列出了它。
